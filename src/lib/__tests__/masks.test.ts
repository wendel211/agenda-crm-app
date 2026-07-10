import { dateMaskToISO, maskCurrency, maskDate, maskPhone, parseCurrency } from '../masks';

describe('maskPhone', () => {
  it('formata progressivamente', () => {
    expect(maskPhone('11')).toBe('(11');
    expect(maskPhone('119887')).toBe('(11) 9887');
    expect(maskPhone('11988771234')).toBe('(11) 98877-1234');
  });

  it('descarta o excedente e caracteres não numéricos', () => {
    expect(maskPhone('11988771234999')).toBe('(11) 98877-1234');
    expect(maskPhone('(11) 98877-1234')).toBe('(11) 98877-1234');
    expect(maskPhone('')).toBe('');
  });
});

describe('maskCurrency / parseCurrency', () => {
  it('trata dígitos como centavos', () => {
    expect(parseCurrency(maskCurrency('1234'))).toBe(12.34);
    expect(parseCurrency(maskCurrency('100'))).toBe(1);
  });

  it('vazio vira zero', () => {
    expect(maskCurrency('')).toBe('');
    expect(parseCurrency('')).toBe(0);
  });
});

describe('maskDate / dateMaskToISO', () => {
  it('formata DD/MM/AAAA e converte para ISO', () => {
    expect(maskDate('14031992')).toBe('14/03/1992');
    expect(dateMaskToISO('14/03/1992')).toBe('1992-03-14');
  });

  it('data incompleta não converte', () => {
    expect(dateMaskToISO('14/03')).toBeUndefined();
  });
});
