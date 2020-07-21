import React, {
  useEffect,
  useState,
  useCallback,
  useMemo,
  useLayoutEffect,
} from 'react';
import { Image } from 'react-native';

import Icon from 'react-native-vector-icons/Feather';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation, useRoute } from '@react-navigation/native';
import formatValue from '../../utils/formatValue';

import api from '../../services/api';

import {
  Container,
  Header,
  ScrollContainer,
  FoodsContainer,
  Food,
  FoodImageContainer,
  FoodContent,
  FoodTitle,
  FoodDescription,
  FoodPricing,
  AdditionalsContainer,
  Title,
  TotalContainer,
  AdittionalItem,
  AdittionalItemText,
  AdittionalQuantity,
  PriceButtonContainer,
  TotalPrice,
  QuantityContainer,
  FinishOrderButton,
  ButtonText,
  IconContainer,
} from './styles';

interface Params {
  id: number;
}

interface Extra {
  id: number;
  name: string;
  value: number;
  quantity: number;
}

interface Food {
  id: number;
  name: string;
  description: string;
  price: number;
  image_url: string;
  formattedPrice: string;
  extras: Extra[];
}

interface FavoriteFood {
  id: number;
  name: string;
  description: string;
  price: number;
  image_url: string;
  thumbnail_url: string;
}

interface FoodOrder {
  product_id: number;
  name: string;
  description: string;
  price: number;
  thumbnail_url: string;
  extras: Extra[];
}

const FoodDetails: React.FC = () => {
  const [food, setFood] = useState({} as Food);
  const [extras, setExtras] = useState<Extra[]>([]);
  const [isFavorite, setIsFavorite] = useState(false);
  const [foodQuantity, setFoodQuantity] = useState(1);

  const navigation = useNavigation();
  const route = useRoute();

  const routeParams = route.params as Params;

  useEffect(() => {
    async function loadFood(): Promise<void> {
      // Load a specific food with extras based on routeParams id
      const response = await api.get(`foods/${routeParams.id}`);
      setFood({
        ...response.data,
        formattedPrice: formatValue(response.data.price),
      });
      setExtras(
        response.data.extras.map((extra: Extra) => {
          return { ...extra, quantity: 0 };
        }),
      );
    }

    loadFood();
  }, [routeParams]);

  function handleIncrementExtra(id: number): void {
    // Increment extra quantity
    const item = food.extras.find(extra => extra.id === id);

    if (item) {
      setExtras([
        ...extras.map(it => {
          if (it.id === item.id) {
            return {
              ...it,
              quantity: it.quantity + 1,
            };
          }
          return it;
        }),
      ]);
    }
  }

  function handleDecrementExtra(id: number): void {
    // Decrement extra quantity
    const item = food.extras.find(extra => extra.id === id);

    if (item) {
      setExtras([
        ...extras.map(it => {
          if (it.id === item.id) {
            return {
              ...it,
              quantity: it.quantity > 0 ? it.quantity - 1 : 0,
            };
          }
          return it;
        }),
      ]);
    }
  }

  const handleIncrementFood = useCallback(() => {
    // Increment food quantity
    setFoodQuantity(foodQuantity + 1);
  }, [foodQuantity]);

  const handleDecrementFood = useCallback(() => {
    // Decrement food quantity
    if (foodQuantity > 1) setFoodQuantity(foodQuantity - 1);
  }, [foodQuantity]);

  const toggleFavorite = useCallback(async () => {
    // Toggle if food is favorite or not
    if (food) {
      const {
        id,
        name,
        description,
        price,
        image_url,
        thumbnail_url,
      } = Object.assign({} as FavoriteFood, food);
      // const { id, name, description, price, image_url, thumbnail_url } = food;
      if (isFavorite) {
        await api.delete(`favorites/${id}`);
      } else {
        await api.post('favorites', {
          id,
          name,
          description,
          price,
          image_url,
          thumbnail_url,
        });
      }
      setIsFavorite(!isFavorite);
    }
  }, [isFavorite, food]);

  const cartTotal = useMemo(() => {
    // Calculate cartTotal
    const totalExtras = extras.reduce((acc, cur) => {
      return acc + cur.quantity * cur.value;
    }, 0);
    const totalFoods = food.price * foodQuantity;

    return formatValue(totalExtras + totalFoods);
  }, [extras, food, foodQuantity]);

  async function handleFinishOrder(): Promise<void> {
    // Finish the order and save on the API
    const { id, name, description, price } = food;
    const orders: FoodOrder[] = [];

    const extraOrders = extras.filter(item => {
      return item.quantity > 0;
    });

    for (let i = 0; i < foodQuantity; i += 1) {
      orders.push({
        product_id: id,
        name,
        description,
        price,
        thumbnail_url: food.image_url,
        extras: extraOrders,
      });
    }

    await api.post('orders', orders);
  }

  // Calculate the correct icon name
  const favoriteIconName = useMemo(
    () => (isFavorite ? 'favorite' : 'favorite-border'),
    [isFavorite],
  );

  useLayoutEffect(() => {
    // Add the favorite icon on the right of the header bar
    navigation.setOptions({
      headerRight: () => (
        <MaterialIcon
          name={favoriteIconName}
          size={24}
          color="#FFB84D"
          onPress={() => toggleFavorite()}
        />
      ),
    });
  }, [navigation, favoriteIconName, toggleFavorite]);

  return (
    <Container>
      <Header />

      <ScrollContainer>
        <FoodsContainer>
          <Food>
            <FoodImageContainer>
              <Image
                style={{ width: 327, height: 183 }}
                source={{
                  uri: food.image_url,
                }}
              />
            </FoodImageContainer>
            <FoodContent>
              <FoodTitle>{food.name}</FoodTitle>
              <FoodDescription>{food.description}</FoodDescription>
              <FoodPricing>{food.formattedPrice}</FoodPricing>
            </FoodContent>
          </Food>
        </FoodsContainer>
        <AdditionalsContainer>
          <Title>Adicionais</Title>
          {extras.map(extra => (
            <AdittionalItem key={extra.id}>
              <AdittionalItemText>{extra.name}</AdittionalItemText>
              <AdittionalQuantity>
                <Icon
                  size={15}
                  color="#6C6C80"
                  name="minus"
                  onPress={() => handleDecrementExtra(extra.id)}
                  testID={`decrement-extra-${extra.id}`}
                />
                <AdittionalItemText testID={`extra-quantity-${extra.id}`}>
                  {extra.quantity}
                </AdittionalItemText>
                <Icon
                  size={15}
                  color="#6C6C80"
                  name="plus"
                  onPress={() => handleIncrementExtra(extra.id)}
                  testID={`increment-extra-${extra.id}`}
                />
              </AdittionalQuantity>
            </AdittionalItem>
          ))}
        </AdditionalsContainer>
        <TotalContainer>
          <Title>Total do pedido</Title>
          <PriceButtonContainer>
            <TotalPrice testID="cart-total">{cartTotal}</TotalPrice>
            <QuantityContainer>
              <Icon
                size={15}
                color="#6C6C80"
                name="minus"
                onPress={handleDecrementFood}
                testID="decrement-food"
              />
              <AdittionalItemText testID="food-quantity">
                {foodQuantity}
              </AdittionalItemText>
              <Icon
                size={15}
                color="#6C6C80"
                name="plus"
                onPress={handleIncrementFood}
                testID="increment-food"
              />
            </QuantityContainer>
          </PriceButtonContainer>

          <FinishOrderButton onPress={() => handleFinishOrder()}>
            <ButtonText>Confirmar pedido</ButtonText>
            <IconContainer>
              <Icon name="check-square" size={24} color="#fff" />
            </IconContainer>
          </FinishOrderButton>
        </TotalContainer>
      </ScrollContainer>
    </Container>
  );
};

export default FoodDetails;
