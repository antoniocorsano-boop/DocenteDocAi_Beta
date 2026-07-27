
import { describe, it, expect } from 'vitest';
import { sanitizeHTML } from '../../../src/utils/securityUtils';

describe('sanitizeHTML', () => {
  it('dovrebbe rimuovere i tag <script>', () => {
    const input = '<p>Hello</p><script>alert("XSS")</script>';
    const output = sanitizeHTML(input);
    expect(output).not.toContain('<script>');
    expect(output).toContain('<p>Hello</p>');
  });

  it('dovrebbe rimuovere gli attributi on* (event handlers)', () => {
    const input = '<p onclick="alert(\'XSS\')">Testo normale</p><button onclick="alert(\'XSS\')">Click me</button>';
    const output = sanitizeHTML(input);
    expect(output).toContain('<p>Testo normale</p>');
    expect(output).not.toContain('onclick');
  });

  it('dovrebbe rimuovere i link javascript:', () => {
    const input = '<a href="javascript:alert(\'XSS\')">Link</a>';
    const output = sanitizeHTML(input);
    expect(output).not.toContain('javascript:');
    expect(output).toContain('<a>Link</a>');
  });

  it('dovrebbe mantenere i tag sicuri', () => {
    const input = '<h1>Title</h1><p class="my-class">Text <strong>Bold</strong></p>';
    const output = sanitizeHTML(input);
    expect(output).toBe(input);
  });

  it('dovrebbe gestire input vuoti', () => {
    expect(sanitizeHTML('')).toBe('');
  });

  it('dovrebbe rimuovere protocolli pericolosi in vari attributi', () => {
    const input = `
      <img src="javascript:alert(1)">
      <img longdesc="vbscript:msgbox(1)">
      <a href="data:text/html,<html>">Dangerous Link</a>
      <blockquote cite="javascript:void(0)">Cite</blockquote>
      <img src="data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==">
    `;
    const output = sanitizeHTML(input);
    expect(output).not.toContain('javascript:');
    expect(output).not.toContain('vbscript:');
    expect(output).not.toContain('data:text/html');
    expect(output).toContain('data:image/png');
  });
});
