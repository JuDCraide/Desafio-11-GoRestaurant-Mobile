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
  AdditionalItem,
  AdditionalItemText,
  AdditionalQuantity,
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
  formattedPrice: string;
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

interface Order {
  id: number;
  product_id: number;
  name: string;
  description: string;
  price: number;
  total: string;
  quantity: number;
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

  const { id } = route.params as Params;

  useEffect(() => {
    async function loadFood(): Promise<void> {
      const res = await api.get<Food>(`/foods/${id}`);

      const formattedFood = {
        ...res.data,
        formattedPrice: formatValue(res.data.price),
      };

      setFood(formattedFood);

      const formattedExtras = formattedFood.extras.map(extra => {
        return {
          ...extra,
          formattedPrice: formatValue(extra.value),
          quantity: 0,
        };
      });

      setExtras(formattedExtras);

      const favorites = await api.get<Food[]>(`/favorites`);

      const favorite = favorites.data.find(fav => fav.id === id);
      setIsFavorite(!!favorite);
    }
    loadFood();
  }, [id]);

  function handleIncrementExtra(id: number): void {
    setExtras(adicionals =>
      adicionals.map(adicional => {
        if (adicional.id === id) {
          return {
            ...adicional,
            quantity: adicional.quantity + 1,
          };
        }
        return adicional;
      }),
    );
  }

  function handleDecrementExtra(id: number): void {
    setExtras(adicionals =>
      adicionals.map(adicional => {
        if (adicional.id === id && adicional.quantity > 0) {
          return {
            ...adicional,
            quantity: adicional.quantity - 1,
          };
        }
        return adicional;
      }),
    );
  }

  function handleIncrementFood(): void {
    setFoodQuantity(quantity => quantity + 1);
  }

  function handleDecrementFood(): void {
    if (foodQuantity > 1) {
      setFoodQuantity(quantity => quantity - 1);
    }
  }

  const toggleFavorite = useCallback(async () => {
    setIsFavorite(favorite => !favorite);
    if (!isFavorite) {
      api.post('/favorites', food);
    } else {
      api.delete(`/favorites/${food.id}`);
    }
  }, [isFavorite, food]);

  const cartTotal = useMemo(() => {
    const cost =
      foodQuantity *
      (Number(food.price) +
        extras.reduce(
          (total, extra) => total + extra.value * extra.quantity,
          0,
        ));

    return formatValue(cost);
  }, [extras, food, foodQuantity]);

  async function handleFinishOrder(): Promise<void> {
    const order: Order = {
      id: Math.floor(Math.random() * 99999),
      product_id: food.id,
      name: food.name,
      description: food.description,
      price: food.price,
      total: cartTotal,
      quantity: foodQuantity,
      thumbnail_url: food.image_url,
      extras,
    };
    await api.post('/orders', order);

    navigation.navigate('DashboardStack');
  }

  const favoriteIconName = useMemo(
    () => (isFavorite ? 'favorite' : 'favorite-border'),
    [isFavorite],
  );

  useLayoutEffect(() => {
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
            <AdditionalItem key={extra.id}>
              <AdditionalItemText>{extra.name}</AdditionalItemText>
              <AdditionalItemText> - {extra.formattedPrice}</AdditionalItemText>
              <AdditionalQuantity>
                <Icon
                  size={15}
                  color="#6C6C80"
                  name="minus"
                  onPress={() => handleDecrementExtra(extra.id)}
                  testID={`decrement-extra-${extra.id}`}
                />
                <AdditionalItemText testID={`extra-quantity-${extra.id}`}>
                  {extra.quantity}
                </AdditionalItemText>
                <Icon
                  size={15}
                  color="#6C6C80"
                  name="plus"
                  onPress={() => handleIncrementExtra(extra.id)}
                  testID={`increment-extra-${extra.id}`}
                />
              </AdditionalQuantity>
            </AdditionalItem>
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
              <AdditionalItemText testID="food-quantity">
                {foodQuantity}
              </AdditionalItemText>
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
