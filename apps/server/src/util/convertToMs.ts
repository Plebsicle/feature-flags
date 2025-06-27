function convertToMilliseconds(frequency: { value: number, unit: 'minutes' | 'hours' | 'days' }): number {
    const unitToMs = {
        minutes: 60 * 1000,
        hours: 60 * 60 * 1000,
        days: 24 * 60 * 60 * 1000
    };
    return frequency.value * unitToMs[frequency.unit];
}

export {convertToMilliseconds};