import { HeatmapStockItem } from "./heatmap-data";

export interface TreemapInputItem {
  id: string;
  value: number;
  [key: string]: any;
}

export interface TreemapRect<T = any> {
  data: T;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface SectorLayout {
  sector: string;
  x: number;
  y: number;
  width: number;
  height: number;
  stocks: StockLayout[];
}

export interface StockLayout extends HeatmapStockItem {
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
}

/**
 * Standard Squarified Treemap layout (Bruls, Huizing, van Wijk algorithm)
 * Guarantees aspect ratios close to 1:1 and fills 100% of the given bounding box.
 */
export function squarify<T extends TreemapInputItem>(
  items: T[],
  x: number,
  y: number,
  width: number,
  height: number
): TreemapRect<T>[] {
  if (!items || items.length === 0 || width <= 0 || height <= 0) return [];

  const totalValue = items.reduce((sum, item) => sum + Math.max(0.001, item.value), 0);
  if (totalValue === 0) return [];

  const totalArea = width * height;
  const normalized = items
    .map((item) => ({
      data: item,
      area: (Math.max(0.001, item.value) / totalValue) * totalArea,
    }))
    .sort((a, b) => b.area - a.area);

  const rects: TreemapRect<T>[] = [];
  layoutRow(normalized, [], x, y, width, height, rects);
  return rects;
}

interface NormalizedItem<T> {
  data: T;
  area: number;
}

function layoutRow<T>(
  children: NormalizedItem<T>[],
  row: NormalizedItem<T>[],
  x: number,
  y: number,
  width: number,
  height: number,
  result: TreemapRect<T>[]
) {
  if (children.length === 0) {
    if (row.length > 0) {
      layoutItems(row, x, y, width, height, result);
    }
    return;
  }

  const c = children[0];
  const side = Math.min(width, height);

  if (row.length === 0) {
    layoutRow(children.slice(1), [c], x, y, width, height, result);
    return;
  }

  const newRow = [...row, c];
  if (worstAspectRatio(row, side) >= worstAspectRatio(newRow, side)) {
    layoutRow(children.slice(1), newRow, x, y, width, height, result);
  } else {
    // Current row is optimal, lay it down
    const rowArea = row.reduce((sum, item) => sum + item.area, 0);
    const rowThickness = rowArea / side;
    layoutItems(row, x, y, width, height, result);

    if (width >= height) {
      layoutRow(children, [], x + rowThickness, y, Math.max(0, width - rowThickness), height, result);
    } else {
      layoutRow(children, [], x, y + rowThickness, width, Math.max(0, height - rowThickness), result);
    }
  }
}

function worstAspectRatio<T>(row: NormalizedItem<T>[], side: number): number {
  if (side <= 0) return Infinity;
  const rowArea = row.reduce((sum, item) => sum + item.area, 0);
  if (rowArea <= 0) return Infinity;
  const s2 = side * side;
  const r2 = rowArea * rowArea;
  let maxAspect = 0;
  for (const item of row) {
    const a = item.area;
    if (a <= 0) continue;
    const aspect = Math.max((s2 * a) / r2, r2 / (s2 * a));
    if (aspect > maxAspect) maxAspect = aspect;
  }
  return maxAspect;
}

function layoutItems<T>(
  row: NormalizedItem<T>[],
  x: number,
  y: number,
  width: number,
  height: number,
  result: TreemapRect<T>[]
) {
  const rowArea = row.reduce((sum, item) => sum + item.area, 0);
  const isHoriz = width >= height;
  const side = Math.max(1, isHoriz ? height : width);
  const rowThickness = rowArea / side;

  let offset = 0;
  for (const item of row) {
    const itemLength = item.area / rowThickness;
    if (isHoriz) {
      result.push({
        data: item.data,
        x,
        y: y + offset,
        width: rowThickness,
        height: itemLength,
      });
      offset += itemLength;
    } else {
      result.push({
        data: item.data,
        x: x + offset,
        y,
        width: itemLength,
        height: rowThickness,
      });
      offset += itemLength;
    }
  }
}

/**
 * Return heatmap color matching Perplexity Finance dark mode scale
 */
export function getHeatmapColor(changePercent: number = 0): string {
  if (changePercent >= 3.0) return "#2ebd85"; // intense green
  if (changePercent >= 1.5) return "#239a6a"; // medium-high green
  if (changePercent >= 0.5) return "#1b6e4e"; // medium green
  if (changePercent > 0.0) return "#144f38"; // dark green
  if (changePercent === 0.0) return "#202227"; // neutral dark slate
  if (changePercent > -0.5) return "#4a191f"; // dark red
  if (changePercent > -1.5) return "#75222b"; // medium red
  if (changePercent > -3.0) return "#ad2c38"; // medium-high red
  return "#e53e3e"; // intense red
}

/**
 * 2-Level Hierarchical Treemap:
 * 1. Groups stocks by Sector and squarifies Sectors across (width x height)
 * 2. Leaves a top header in each Sector and squarifies individual stocks inside
 */
export function computeHierarchicalTreemap(
  stocks: HeatmapStockItem[],
  width: number,
  height: number
): SectorLayout[] {
  if (!stocks || stocks.length === 0 || width <= 0 || height <= 0) return [];

  // 1. Group stocks by sector
  const sectorMap = new Map<string, HeatmapStockItem[]>();
  for (const stock of stocks) {
    const list = sectorMap.get(stock.sector) || [];
    list.push(stock);
    sectorMap.set(stock.sector, list);
  }

  // 2. Prepare sector items with aggregate weights
  const sectorItems = Array.from(sectorMap.entries()).map(([sector, groupStocks]) => ({
    id: sector,
    sector,
    value: groupStocks.reduce((sum, s) => sum + s.weight, 0),
    stocks: groupStocks,
  }));

  // 3. Squarify sectors in outer canvas
  const sectorRects = squarify(sectorItems, 0, 0, width, height);

  // 4. For each sector, lay out inner stock items
  const result: SectorLayout[] = [];

  for (const sRect of sectorRects) {
    const sData = sRect.data;
    const headerHeight = Math.min(20, Math.max(14, sRect.height * 0.1));
    const innerPadding = 1.5;

    const innerX = sRect.x + innerPadding;
    const innerY = sRect.y + headerHeight + innerPadding;
    const innerW = Math.max(0, sRect.width - innerPadding * 2);
    const innerH = Math.max(0, sRect.height - headerHeight - innerPadding * 2);

    const stockItems = sData.stocks.map((s) => ({
      id: s.cleanSymbol,
      value: s.weight,
      stock: s,
    }));

    const stockRects = squarify(stockItems, innerX, innerY, innerW, innerH);

    const laidOutStocks: StockLayout[] = stockRects.map((sr) => {
      const s = sr.data.stock;
      return {
        ...s,
        x: sr.x,
        y: sr.y,
        width: sr.width,
        height: sr.height,
        color: getHeatmapColor(s.changePercent),
      };
    });

    result.push({
      sector: sData.sector,
      x: sRect.x,
      y: sRect.y,
      width: sRect.width,
      height: sRect.height,
      stocks: laidOutStocks,
    });
  }

  return result;
}
