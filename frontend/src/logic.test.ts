// Mock data for testing
const mockComments = [
  { id: 1, likes: 10, author: 'User A' },
  { id: 2, likes: 10, author: 'User B' },
  { id: 3, likes: 5, author: 'User C' },
];

// The sorting logic we want to test (extracted from App.tsx logic)
const stableSort = (comments: { id: number; likes: number; author: string }[]) => {
  return [...comments].sort((a, b) => b.likes - a.likes || b.id - a.id);
};

describe('B01: Ranking Stability Logic', () => {
  test('should maintain stable order when likes are equal', () => {
    const sorted = stableSort(mockComments);
    
    // Expect: likes 10 (id 2) first, then likes 10 (id 1), then likes 5 (id 3)
    // Because b.id - a.id is used for secondary sort
    expect(sorted[0].id).toBe(2);
    expect(sorted[1].id).toBe(1);
    expect(sorted[2].id).toBe(3);
  });

  test('should correctly track rank changes', () => {
    const prevRanks: Record<number, { rank: number }> = {
      1: { rank: 1 },
      2: { rank: 2 }
    };
    
    const currentRankOfId1 = 2; // Id 1 moved down
    const p = prevRanks[1];
    let rt = 'same';
    if (p.rank > currentRankOfId1) rt = 'up';
    else if (p.rank < currentRankOfId1) rt = 'down';
    
    expect(rt).toBe('down');
  });
});

describe('P04: Data Sanitization Logic', () => {
  const decodeEntities = (text: string) => {
    const div = document.createElement('div');
    div.innerHTML = text;
    return div.textContent || '';
  };

  test('should handle HTML entities correctly', () => {
    const input = 'Hello &lt;b&gt;World&lt;/b&gt;';
    const output = decodeEntities(input);
    expect(output).toBe('Hello <b>World</b>');
  });
});
