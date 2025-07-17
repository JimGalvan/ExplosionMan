class GameUtils {
  static rangesOverlap(aStart: number, aEnd: number, bStart: number, bEnd: number) {
    return !(aEnd < bStart || bEnd < aStart);
  }

}

