const puppeteer = require('puppeteer');
const {
  generateDbDiagramSyntax,
  quoteIfNeeded,
  extractBubbleData
} = require('../app');

jest.mock('puppeteer', () => ({
  launch: jest.fn(),
}));

describe('generateDbDiagramSyntax', () => {
  it('should generate correct DBML syntax for valid input', () => {
    const input = [{
      json: {
        _parent: {
          cache: {
            User: {
              "%f3": {
                id: {
                  "%v": "int"
                },
                name: {
                  "%v": "string"
                }
              }
            }
          }
        }
      }
    }];

    const output = generateDbDiagramSyntax(JSON.stringify(input));

    const expectedOutput = `Table User {
  id int
  name string
}

`;

    expect(output).toBe(expectedOutput);
  });
});

describe('quoteIfNeeded', () => {
  it('should quote strings containing a dot', () => {
    const input = "varchar.255";
    const output = quoteIfNeeded(input);
    expect(output).toBe('"varchar.255"');
  });

  it('should not quote strings without a dot', () => {
    const input = "int";
    const output = quoteIfNeeded(input);
    expect(output).toBe('int');
  });
});

describe('extractBubbleData', () => {
  const fakePage = {
    setDefaultNavigationTimeout: jest.fn(),
    goto: jest.fn(),
    evaluate: jest.fn(),
    close: jest.fn(),
  };

  beforeEach(() => {
    puppeteer.launch.mockResolvedValue({
      newPage: jest.fn().mockResolvedValue(fakePage),
      close: jest.fn(),
    });
  });

  it('should extract data from the given URL', async () => {
    fakePage.evaluate.mockResolvedValue(JSON.stringify({ data: "fake_data" }));
    const result = await extractBubbleData('https://test-url.com');
    expect(result).toEqual(JSON.stringify({ data: "fake_data" }));
  });

  it('should throw error if data extraction fails', async () => {
    fakePage.evaluate.mockRejectedValue(new Error('Extraction failed'));
    await expect(extractBubbleData('https://test-url.com')).rejects.toThrow('Extraction failed');
  });
});
