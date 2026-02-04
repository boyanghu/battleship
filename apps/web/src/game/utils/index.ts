export {
  type Coord,
  coordToString,
  xyToString,
  stringToCoord,
  parseCoordinate,
  toCoordinate,
  isInBounds,
  isCoordInBounds,
  cellKey,
  parseCellKey,
} from "./coordinates";

export {
  type Ship,
  type ShipType,
  type Orientation,
  getShipCells,
  clampToBounds,
  buildOccupancyMap,
  findOverlappingShips,
  findValidPosition,
  resolvePlacement,
  rotateAndResolve,
  moveAndResolve,
  clampDragPosition,
} from "./placementResolver";

export {
  getStrategistRecommendation,
  formatStrategistInstruction,
} from "./strategist";

export {
  type ShipInfo,
  SHIPS,
  SHIP_NAMES,
  SHIP_LENGTHS,
  REQUIRED_SHIPS,
  TOTAL_SHIP_CELLS,
} from "./ships";
