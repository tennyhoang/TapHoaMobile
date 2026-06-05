import type { Meta, StoryObj } from '@storybook/react-native';
import ProductCard from '../ProductCard';

const meta: Meta<typeof ProductCard> = {
  title: 'Components/ProductCard',
  component: ProductCard,
  args: {
    product: {
      id: 'p1',
      name: 'Rau muống sạch VietGAP',
      price: 15000,
      discountPrice: undefined,
      stock: 20,
      thumbnailUrl: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=400',
      images: [],
      categoryId: 'c1',
      categoryName: 'Rau củ',
      description: 'Rau muống tươi sạch',
      averageRating: 4.5,
      reviewCount: 12,
      createdAt: new Date().toISOString(),
    },
  },
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const OutOfStock: Story = {
  args: {
    product: { ...meta.args!.product!, stock: 0 },
  },
};

export const WithDiscount: Story = {
  args: {
    product: { ...meta.args!.product!, discountPrice: 12000 },
  },
};
