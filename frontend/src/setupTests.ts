import '@testing-library/jest-dom';
// @ts-expect-error - util is a node module, not available in browser types
import { TextEncoder, TextDecoder } from 'util';

Object.assign(globalThis, { TextEncoder, TextDecoder });
