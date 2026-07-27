import { separatePositions } from '../NKAForceMap';
import { NKANode } from '../types';

describe('NKAForceMap layout helpers', () => {
  it('separates overlapping nodes to at least minDistance', () => {
    const positions = [
      { id: '1', label: 'A', color: '80', elevation: 1, depth: 0.5, shape: 'circle', actions: [], x: 100, y: 100 },
      { id: '2', label: 'B', color: '90', elevation: 1, depth: 0.5, shape: 'circle', actions: [], x: 100, y: 100 },
      { id: '3', label: 'C', color: '90', elevation: 1, depth: 0.5, shape: 'circle', actions: [], x: 120, y: 100 },
    ] as unknown as Array<NKANode & { x: number; y: number }>;

    const minDistance = 40;
    const separated = separatePositions(positions, minDistance);

    // check all pairs are at least minDistance apart
    for (let i = 0; i < separated.length; i++) {
      for (let j = i + 1; j < separated.length; j++) {
        const dx = separated[i].x - separated[j].x;
        const dy = separated[i].y - separated[j].y;
        const d = Math.sqrt(dx * dx + dy * dy);
        expect(d).toBeGreaterThanOrEqual(minDistance - 0.5); // small epsilon
      }
    }
  });
});

