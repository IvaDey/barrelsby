import MockFs from 'mock-fs';
import { expandDirectories } from './expandDirectories';
import { Logger } from './options/logger';
import { Signale } from 'signale';

describe('expandDirectories', () => {
  let logger: Logger;
  let warnSpy: jest.SpyInstance;

  beforeEach(() => {
    logger = new Signale();
    warnSpy = jest.spyOn(logger, 'warn').mockImplementation();
  });

  afterEach(() => {
    MockFs.restore();
    warnSpy.mockRestore();
  });

  it('should return literal directories unchanged', () => {
    MockFs({
      'src/shared': { 'index.ts': '' },
    });

    const result = expandDirectories(['src/shared'], logger);

    expect(result).toEqual(['src/shared']);
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it('should expand glob patterns to matching directories', () => {
    MockFs({
      'src/modules': {
        users: { actions: { 'a.ts': '' }, controllers: { 'b.ts': '' } },
        posts: { actions: { 'c.ts': '' } },
        comments: { dto: { 'd.ts': '' } },
      },
    });

    const result = expandDirectories(['src/modules/*/actions'], logger);

    expect(result).toEqual(['src/modules/posts/actions', 'src/modules/users/actions']);
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it('should handle ** glob patterns', () => {
    MockFs({
      a: {
        b: { c: { d: { 'f.ts': '' } } },
        e: { 'g.ts': '' },
      },
    });

    const result = expandDirectories(['a/**/d'], logger);

    expect(result).toEqual(['a/b/c/d']);
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it('should warn and skip patterns with no matches', () => {
    MockFs({
      src: { 'index.ts': '' },
    });

    const result = expandDirectories(['src/modules/*/actions'], logger);

    expect(result).toEqual([]);
    expect(warnSpy).toHaveBeenCalledWith(
      'Directory pattern "src/modules/*/actions" did not match any directories'
    );
  });

  it('should mix literal directories and glob patterns', () => {
    MockFs({
      'src/shared': { 'index.ts': '' },
      'src/modules': {
        users: { actions: { 'a.ts': '' } },
        posts: { actions: { 'b.ts': '' } },
      },
    });

    const result = expandDirectories(['src/shared', 'src/modules/*/actions'], logger);

    expect(result).toEqual(['src/modules/posts/actions', 'src/modules/users/actions', 'src/shared']);
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it('should deduplicate directories', () => {
    MockFs({
      'src/shared': { 'index.ts': '' },
    });

    const result = expandDirectories(['src/shared', 'src/shared'], logger);

    expect(result).toEqual(['src/shared']);
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it('should deduplicate when glob and literal resolve to the same directory', () => {
    MockFs({
      src: {
        modules: {
          users: { actions: { 'a.ts': '' } },
          posts: { actions: { 'b.ts': '' } },
        },
      },
    });

    const result = expandDirectories(['src/modules/users/actions', 'src/modules/*/actions'], logger);

    expect(result).toEqual(['src/modules/posts/actions', 'src/modules/users/actions']);
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it('should handle empty input', () => {
    MockFs({});

    const result = expandDirectories([], logger);

    expect(result).toEqual([]);
    expect(warnSpy).not.toHaveBeenCalled();
  });

  it('should handle default ./ directory', () => {
    MockFs({
      'index.ts': '',
    });

    const result = expandDirectories(['./'], logger);

    expect(result).toEqual(['./']);
    expect(warnSpy).not.toHaveBeenCalled();
  });
});
