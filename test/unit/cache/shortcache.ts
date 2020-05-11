import { expect } from 'chai';
import { ShortCache, TextState, Links } from '../../../src';

describe('ShortCache', () => {

  it('should store and retrieve State objects', () => {

    const shortCache = new ShortCache();
    const state = new TextState('http://example/foo','hi', new Headers(), new Links());
    shortCache.store(state);

    expect(shortCache.has('http://example/foo')).to.equal(true);

    const ts = Date.now();
    // We're resetting the timestamps so they dont drift during
    // cloning
    state.timestamp = ts;

    const newState = shortCache.get('http://example/foo')!;
    newState.timestamp = ts;

    // Note we use .eql
    expect(newState).to.eql(state);

  });

  it('should clone objects, not store the original', () => {

    const shortCache = new ShortCache();
    const state = new TextState('http://example/foo','hi', new Headers(), new Links());
    shortCache.store(state);

    const ts = Date.now();
    // We're resetting the timestamps so they dont drift during
    // cloning
    state.timestamp = ts;

    const newState = shortCache.get('http://example/foo')!;
    newState.timestamp = ts;

    // Note we use .equal, and not .eql. They check for different things.
    expect(newState).to.not.equal(state);

  });

  it('should allow items to be deleted', () => {

    const shortCache = new ShortCache();
    const state = new TextState('http://example/foo','hi', new Headers(), new Links());
    shortCache.store(state);
    shortCache.delete('http://example/foo');

    expect(shortCache.has('http://example/foo')).to.equal(false);

    const newState = shortCache.get('http://example/foo');

    // Note we use .eql
    expect(newState).to.eql(null);

  });

  it('clear() should work', () => {

    const shortCache = new ShortCache();
    const state = new TextState('http://example/foo','hi', new Headers(), new Links());
    shortCache.store(state);
    shortCache.clear();

    const newState = shortCache.get('http://example/foo');

    // Note we use .eql
    expect(newState).to.eql(null);

  });

  it('should automatically expire items after a the timeout has hit', async() => {

    // Small timeout
    const shortCache = new ShortCache(0);
    const state = new TextState('http://example/foo','hi', new Headers(), new Links());
    shortCache.store(state);

    await new Promise(res => setTimeout(res, 10));

    expect(shortCache.has('http://example/foo')).to.equal(false);

  });

});
