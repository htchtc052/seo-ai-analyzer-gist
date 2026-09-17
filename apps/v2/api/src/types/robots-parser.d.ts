declare module "robots-parser" {
  type Robot = {
    isAllowed(url: string, userAgent?: string): boolean | undefined;
    isDisallowed(url: string, userAgent?: string): boolean | undefined;
    getCrawlDelay(userAgent?: string): number | undefined;
    getSitemaps(): string[];
  };
  function robotsParser(url: string, contents: string): Robot;
  export = robotsParser;
}
