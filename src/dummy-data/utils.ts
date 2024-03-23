import axios from 'axios';

export const randomizeArray = <T>(original: T[], newLength: number) => {
  return Array.from(
    { length: newLength },
    () => original[Math.floor(Math.random() * original.length)],
  );
};

export const generateRandomUniqueNumbers = (
  amount: number,
  max: number,
  min: number = 0,
): number[] => {
  const numbers: number[] = [];

  while (numbers.length <= amount) {
    const number: number = Math.floor(Math.random() * max - min) + min;
    if (!numbers.includes(number)) numbers.push(number);
  }

  return numbers;
};

export const groupArray = <T>(arr: T[], groupSize: number): T[][] => {
  const result: T[][] = [];
  for (let i = 0; i < arr.length; i += groupSize) {
    result.push(arr.slice(i, i + groupSize));
  }
  return result;
};

export const getImageBufferFromUrl = async (url: string) => {
  const response = await axios.get(url, { responseType: 'arraybuffer' });
  const buffer = Buffer.from(response.data, 'binary');
  return buffer;
};
