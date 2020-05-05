import React, {
  createContext,
  useState,
  useCallback,
  useContext,
  useEffect,
} from 'react';

import AsyncStorage from '@react-native-community/async-storage';

interface Product {
  id: string;
  title: string;
  image_url: string;
  price: number;
  quantity?: number;
}

interface CartContext {
  products: Product[];
  addToCart(item: Product): void;
  increment(id: string): void;
  decrement(id: string): void;
}

const CartContext = createContext<CartContext | null>(null);

const CartProvider: React.FC = ({ children }) => {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    async function loadProducts(): Promise<void> {
      const productsStoraged = await AsyncStorage.getItem(
        '@GoMarketplace:cart',
      );

      if (productsStoraged) {
        setProducts(JSON.parse(productsStoraged));
      }
    }

    loadProducts();
  }, []);

  useEffect(() => {
    async function saveProducts(): Promise<void> {
      await AsyncStorage.setItem(
        '@GoMarketplace:cart',
        JSON.stringify(products),
      );
    }

    saveProducts();
  }, [products]);

  const addToCart = useCallback(
    async (product: Product) => {
      const productInList = products.find(p => p.id === product.id);

      if (productInList) {
        const quantity = productInList.quantity ? productInList.quantity : 1;

        productInList.quantity = quantity + 1;

        const newProducts = [
          ...products.filter(p => p.id !== productInList.id),
          productInList,
        ];

        setProducts(newProducts);
      } else {
        const { id, title, image_url, price } = product;

        const newProduct = { id, title, image_url, price, quantity: 1 };

        const newProducts = [...products, newProduct];

        setProducts(newProducts);
      }
    },
    [products],
  );

  const increment = useCallback(
    async id => {
      const productInList = products.find(product => product.id === id);
      if (productInList) {
        const quantity = productInList.quantity ? productInList.quantity : 1;
        productInList.quantity = quantity + 1;
        setProducts(state => [
          ...state.filter(p => p.id !== productInList.id),
          productInList,
        ]);
      }
    },
    [products],
  );

  const decrement = useCallback(
    async id => {
      const productIndex = products.findIndex(product => product.id === id);

      if (productIndex >= 0) {
        if (products[productIndex].quantity === 1) {
          const filteredProducts = products.filter(
            product => product.id !== id,
          );

          setProducts(filteredProducts);
        } else {
          const updatedProducts = [...products];

          const productInList = updatedProducts[productIndex];

          const quantity = productInList.quantity ? productInList.quantity : 1;
          updatedProducts[productIndex].quantity = quantity - 1;

          setProducts(updatedProducts);
        }
      }
    },
    [products],
  );

  const value = React.useMemo(
    () => ({ addToCart, increment, decrement, products }),
    [products, addToCart, increment, decrement],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

function useCart(): CartContext {
  const context = useContext(CartContext);

  if (!context) {
    throw new Error(`useCart must be used within a CartProvider`);
  }

  return context;
}

export { CartProvider, useCart };
