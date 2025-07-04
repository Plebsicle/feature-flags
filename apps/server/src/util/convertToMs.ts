function convertToMilliseconds(frequency: { value: number, unit: 'hours' | 'days' | 'weeks' }): number {
    const unitToMs = {
        hours: 60 * 60 * 1000,
        days: 24 * 60 * 60 * 1000,
        weeks: 7 * 24 * 60 * 60 * 1000
    };
    return frequency.value * unitToMs[frequency.unit];
}

export {convertToMilliseconds};