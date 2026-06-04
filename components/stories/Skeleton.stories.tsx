import React from 'react';
import type { Meta, StoryObj } from '@storybook/react-native';
import { View } from 'react-native';
import { ProductCardSkeleton } from '../Skeleton';

const meta: Meta = {
  title: 'Components/Skeleton',
  component: ProductCardSkeleton,
  decorators: [
    Story => (
      <View style={{ padding: 16, backgroundColor: '#F9FAFB' }}>
        <Story />
      </View>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const SingleCard: Story = {};

export const Grid: Story = {
  render: () => (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12 }}>
      {Array.from({ length: 4 }).map((_, i) => (
        <View key={i} style={{ width: '47%' }}>
          <ProductCardSkeleton />
        </View>
      ))}
    </View>
  ),
};
