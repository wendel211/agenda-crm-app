import { minutesToTime, overlapsAny, timeToMinutes, weekdayName } from '../time';

describe('timeToMinutes / minutesToTime', () => {
  it('converte ida e volta', () => {
    expect(timeToMinutes('09:30')).toBe(570);
    expect(minutesToTime(570)).toBe('09:30');
    expect(minutesToTime(0)).toBe('00:00');
    expect(timeToMinutes('19:00')).toBe(1140);
  });
});

describe('overlapsAny (regra de conflito de horário)', () => {
  const busy = [{ start: '10:00', end: '11:00' }];

  it('detecta sobreposição parcial no início e no fim', () => {
    expect(overlapsAny('09:30', 60, busy)).toBe(true);
    expect(overlapsAny('10:30', 60, busy)).toBe(true);
  });

  it('detecta horário totalmente dentro de um ocupado', () => {
    expect(overlapsAny('10:15', 30, busy)).toBe(true);
  });

  it('permite horários encostados (fim de um = início do outro)', () => {
    expect(overlapsAny('09:00', 60, busy)).toBe(false);
    expect(overlapsAny('11:00', 60, busy)).toBe(false);
  });

  it('serviço longo cobre o intervalo ocupado inteiro', () => {
    expect(overlapsAny('09:00', 180, busy)).toBe(true);
  });
});

describe('weekdayName', () => {
  it('mapeia datas para os nomes usados no expediente', () => {
    expect(weekdayName('2026-07-13')).toBe('Segunda');
    expect(weekdayName('2026-07-12')).toBe('Domingo');
    expect(weekdayName('2026-07-18')).toBe('Sábado');
  });
});
