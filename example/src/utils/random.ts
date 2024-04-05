export const random = <T = unknown>(items: T[]) => items[Math.floor(Math.random() * items.length)]
