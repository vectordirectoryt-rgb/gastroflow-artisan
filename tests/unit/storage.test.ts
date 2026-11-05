import { describe, it, expect, beforeEach } from 'vitest';
import { safeLoad, safeSave } from '../../src/core/storage/localStorage';

describe('localStorage adapter', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('guarda y recupera datos tipados correctamente', () => {
    const data = { nombre: 'Harina', stock: 500 };
    safeSave('test_key', data);

    const loaded = safeLoad('test_key', { nombre: '', stock: 0 });
    expect(loaded).toEqual(data);
  });

  it('retorna el fallback si la clave no existe', () => {
    const fallback = { status: 'default' };
    const loaded = safeLoad('non_existent_key', fallback);
    expect(loaded).toEqual(fallback);
  });

  it('retorna el fallback de manera segura si el JSON está corrupto', () => {
    localStorage.setItem('corrupted_key', '{invalid-json:');
    const fallback = ['fallback_item'];
    const loaded = safeLoad('corrupted_key', fallback);
    expect(loaded).toEqual(fallback);
  });
});
