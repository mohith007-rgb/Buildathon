declare module "word-extractor" {
  export default class WordExtractor {
    extract(bufferOrPath: Buffer | string): Promise<{
      getBody(): string;
      getFootnotes(): string;
      getHeaders(): string;
      getAnnotations(): string;
    }>;
  }
}
