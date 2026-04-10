export interface MenuItem {
  id: string;
  name: string;
  price: number;
  category: string;
  image?: string;
}

export interface CartItem extends MenuItem {
  quantity: number;
}

export interface Order {
  id: string;
  items: CartItem[];
  orderType: 'dine-in' | 'takeout' | 'delivery' | 'car' | 'self';
  tableNumber?: string;
  customerName?: string;
  customerPhone?: string;
  customerAddress?: string;
  deliveryCharges?: number;
  riderName?: string;
  waiterName?: string;
  discount: number;
  discountType: 'percent' | 'amount';
  subtotal: number;
  total: number;
  status: 'pending' | 'preparing' | 'ready' | 'completed' | 'cancelled';
  paymentStatus: 'paid' | 'pay-later';
  createdAt: Date;
}

export interface DaySession {
  id: string;
  openingCash: number;
  closingCash?: number;
  startedAt: Date;
  endedAt?: Date;
  orders: Order[];
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  address: string;
  deliveryCharges?: number;
}

export const CATEGORIES = [
  'All', 'Zinger Burger', 'Beef Burger', 'Chicken Burger', 'Broast',
  'Bar B.Q', 'Rolls', 'Boti Plate', 'Kabab', 'Sandwiches',
  'Fries', 'Extra'
];

export const DEFAULT_MENU_ITEMS: MenuItem[] = [
  // Zinger Burger
  { id: 'zb1', name: 'Zinger Junior Burger', price: 370, category: 'Zinger Burger' },
  { id: 'zb2', name: 'Zinger Burger', price: 420, category: 'Zinger Burger' },
  { id: 'zb3', name: 'Zinger Spicy Burger', price: 440, category: 'Zinger Burger' },
  { id: 'zb4', name: 'Zinger Cheese Burger', price: 470, category: 'Zinger Burger' },
  { id: 'zb5', name: 'Zinger Mega Burger', price: 750, category: 'Zinger Burger' },
  // Beef Burger
  { id: 'bb1', name: 'Beef Burger', price: 320, category: 'Beef Burger' },
  { id: 'bb2', name: 'Beef Cheese Burger', price: 370, category: 'Beef Burger' },
  { id: 'bb3', name: 'Beef Spicy Burger', price: 350, category: 'Beef Burger' },
  { id: 'bb4', name: 'Beef Mega Burger', price: 680, category: 'Beef Burger' },
  // Chicken Burger
  { id: 'cb1', name: 'Chicken Burger', price: 320, category: 'Chicken Burger' },
  { id: 'cb2', name: 'Chicken Cheese Burger', price: 370, category: 'Chicken Burger' },
  { id: 'cb3', name: 'Chicken Mega Burger', price: 600, category: 'Chicken Burger' },
  { id: 'cb4', name: 'Chicken Spicy Burger', price: 350, category: 'Chicken Burger' },
  // Broast
  { id: 'br1', name: 'Q. Broast Leg', price: 480, category: 'Broast' },
  { id: 'br2', name: 'Q. Broast Chest', price: 450, category: 'Broast' },
  { id: 'br3', name: 'Q. Broast Cheese Leg', price: 450, category: 'Broast' },
  { id: 'br4', name: 'Q. Broast Cheese Chest', price: 500, category: 'Broast' },
  { id: 'br5', name: 'Broast Spicy Leg', price: 430, category: 'Broast' },
  { id: 'br6', name: 'Broast Spicy Chest', price: 480, category: 'Broast' },
  { id: 'br7', name: 'Half Broast', price: 848, category: 'Broast' },
  { id: 'br8', name: 'Full Broast', price: 1660, category: 'Broast' },
  // Bar B.Q
  { id: 'bq1', name: 'Chicken Tikka Leg', price: 370, category: 'Bar B.Q' },
  { id: 'bq2', name: 'Chicken Tikka Chest', price: 460, category: 'Bar B.Q' },
  { id: 'bq3', name: 'Chicken Behari Tikka', price: 420, category: 'Bar B.Q' },
  { id: 'bq4', name: 'Chick. Malai Tikka Chest', price: 450, category: 'Bar B.Q' },
  { id: 'bq5', name: 'Behari Tikka Leg', price: 380, category: 'Bar B.Q' },
  // Rolls
  { id: 'rl1', name: 'Kabab Roll', price: 200, category: 'Rolls' },
  { id: 'rl2', name: 'Chicken Chatni Roll', price: 220, category: 'Rolls' },
  { id: 'rl3', name: 'Beef Chatni Roll', price: 240, category: 'Rolls' },
  { id: 'rl4', name: 'Beef Mayo Roll', price: 270, category: 'Rolls' },
  { id: 'rl5', name: 'Chicken Mayo Roll', price: 250, category: 'Rolls' },
  { id: 'rl6', name: 'Beef Mayo Cheese Roll', price: 300, category: 'Rolls' },
  { id: 'rl7', name: 'Chicken Mayo Garlic Roll', price: 280, category: 'Rolls' },
  { id: 'rl8', name: 'Beef Mayo Garlic Roll', price: 280, category: 'Rolls' },
  { id: 'rl9', name: 'Malai Boti Roll', price: 260, category: 'Rolls' },
  { id: 'rl10', name: 'Zinger Roll', price: 320, category: 'Rolls' },
  { id: 'rl11', name: 'Zinger Cheese Roll', price: 370, category: 'Rolls' },
  { id: 'rl12', name: 'Rabbani Special Roll', price: 390, category: 'Rolls' },
  { id: 'rl13', name: 'Rabbani Special Cheese Roll', price: 440, category: 'Rolls' },
  // Boti Plate
  { id: 'bp1', name: 'Beef Boti Plate', price: 600, category: 'Boti Plate' },
  { id: 'bp2', name: 'Beef Behari Boti Plate', price: 620, category: 'Boti Plate' },
  { id: 'bp3', name: 'Chicken Boti Plate', price: 620, category: 'Boti Plate' },
  { id: 'bp4', name: 'Chicken Malai Boti Plate', price: 570, category: 'Boti Plate' },
  // Kabab
  { id: 'kb1', name: 'Beef Seekh Kabab', price: 520, category: 'Kabab' },
  { id: 'kb2', name: 'Beef Gola Kabab', price: 520, category: 'Kabab' },
  { id: 'kb3', name: 'Reshmi Kabab', price: 540, category: 'Kabab' },
  // Sandwiches
  { id: 'sw1', name: 'Chicken Sandwich', price: 350, category: 'Sandwiches' },
  { id: 'sw2', name: 'Chicken Cheese Sandwich', price: 480, category: 'Sandwiches' },
  { id: 'sw3', name: 'Club Sandwich', price: 420, category: 'Sandwiches' },
  { id: 'sw4', name: 'Club Cheese Sandwich', price: 480, category: 'Sandwiches' },
  { id: 'sw5', name: 'B.B.Q Sandwich', price: 400, category: 'Sandwiches' },
  { id: 'sw6', name: 'B.B.Q Club Sandwich', price: 450, category: 'Sandwiches' },
  { id: 'sw7', name: 'Malai Club Sandwich', price: 480, category: 'Sandwiches' },
  { id: 'sw8', name: 'Zinger Club Sandwich', price: 480, category: 'Sandwiches' },
  { id: 'sw9', name: 'Egg Sandwich', price: 250, category: 'Sandwiches' },
  { id: 'sw10', name: 'Egg Cheese Sandwich', price: 300, category: 'Sandwiches' },
  // Fries
  { id: 'fr1', name: 'Fries Regular', price: 200, category: 'Fries' },
  { id: 'fr2', name: 'Fries Mayo', price: 270, category: 'Fries' },
  { id: 'fr3', name: 'Fries Masala', price: 230, category: 'Fries' },
  { id: 'fr4', name: 'Pizza Fries (Small)', price: 370, category: 'Fries' },
  { id: 'fr5', name: 'Pizza Fries (Large)', price: 520, category: 'Fries' },
  // Extra
  { id: 'ex1', name: 'Chappati', price: 20, category: 'Extra' },
  { id: 'ex2', name: 'Puri Paratha', price: 50, category: 'Extra' },
  { id: 'ex3', name: 'Paratha (Large)', price: 100, category: 'Extra' },
  { id: 'ex4', name: 'Raita', price: 50, category: 'Extra' },
  { id: 'ex5', name: 'Bun Roll', price: 50, category: 'Extra' },
  { id: 'ex6', name: 'Coleslaw', price: 50, category: 'Extra' },
  { id: 'ex7', name: 'Extra Cheese', price: 50, category: 'Extra' },
  { id: 'ex8', name: 'Extra Mayo Sauce', price: 50, category: 'Extra' },
  { id: 'ex9', name: 'Chatni', price: 30, category: 'Extra' },
];
