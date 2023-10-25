const { chunkSummaries } = require('./summaries');

const testCases = [
  {
    name: '将摘要分成两部分，每部分最大长度为10',
    summaries: '示例摘要1\n---\n示例摘要2\n---\n示例摘要3\n---\n示例摘要4',
    maxChunkLength: 10,
    expected: [
      { summary: '示例摘要1\n---\n示例摘要2' },
      { summary: '示例摘要3\n---\n示例摘要4' },
    ],
  },
  {
    name: '将单个摘要分成两部分，每部分最大长度为20',
    summaries: '这是一个摘要\n---\n这是另一个摘要',
    maxChunkLength: 20,
    expected: [{ summary: '这是一个摘要\n---\n这是另一个摘要' }],
  },
  {
    name: '将摘要分成多个部分，每部分最大长度为6',
    summaries: '摘要1\n---\n摘要2\n---\n摘要3',
    maxChunkLength: 6,
    expected: [
      { summary: '摘要1' },
      { summary: '摘要2' },
      { summary: '摘要3' },
    ],
  },
];

testCases.forEach(({ name, summaries, maxChunkLength, expected }) => {
  const result = chunkSummaries(summaries, maxChunkLength);

  test(name, () => {
    expect(result.length).toBe(expected.length);

    for (let i = 0; i < result.length; i++) {
      expect(result[i]).toBe(expected[i].summary);
    }
  });
});
