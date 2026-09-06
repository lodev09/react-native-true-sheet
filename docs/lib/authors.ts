export interface Author {
  name: string;
  title: string;
  url: string;
  image: string;
}

export const authors: Record<string, Author> = {
  lodev09: {
    name: 'Jovanni Lo',
    title: 'Lead Mobile Developer',
    url: 'https://github.com/lodev09',
    image: 'https://github.com/lodev09.png',
  },
};
