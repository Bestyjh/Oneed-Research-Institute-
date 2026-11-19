import { TextEncoder, TextDecoder } from 'node:util';
import '@testing-library/jest-dom/vitest';

globalThis.TextEncoder = TextEncoder;
globalThis.TextDecoder = TextDecoder;
