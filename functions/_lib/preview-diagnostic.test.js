import { describe, expect, it } from 'vitest';
import { classifySupabaseTarget } from './preview-diagnostic.js';

describe('Supabase Preview diagnostic classification', () => {
  it('recognizes the staging project', () => {
    expect(
      classifySupabaseTarget(
        'https://bvwxgetdaojkdjqpcmci.supabase.co'
      )
    ).toBe('staging');
  });

  it('recognizes the production project', () => {
    expect(
      classifySupabaseTarget(
        'https://jdqacsksryqfvfzejsbv.supabase.co'
      )
    ).toBe('production');
  });

  it.each([
    undefined,
    null,
    '',
    'not-a-url',
    'http://bvwxgetdaojkdjqpcmci.supabase.co',
    'https://other-project.supabase.co',
    'https://bvwxgetdaojkdjqpcmci.supabase.co.evil.example',
    'https://user:password@bvwxgetdaojkdjqpcmci.supabase.co',
    'https://bvwxgetdaojkdjqpcmci.supabase.co?debug=true',
    'https://bvwxgetdaojkdjqpcmci.supabase.co/path',
    'https://bvwxgetdaojkdjqpcmci.supabase.co:8443',
  ])('rejects invalid or unrecognized input: %s', (value) => {
    expect(classifySupabaseTarget(value)).toBe('unknown');
  });
});
