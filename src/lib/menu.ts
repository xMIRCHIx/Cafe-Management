export type MenuItem = { id: string; name: string; category: string; description: string; price: number; image: string; veg: boolean; badge?: string; minutes: number };
export const menu: MenuItem[] = [
  { id: 'p1', name: 'Truffle Mushroom Pizza', category: 'Pizzas', description: 'Wild mushrooms, mozzarella, truffle oil & fresh arugula.', price: 349, image: '/loaded_pizza.png', veg: true, badge: 'Signature', minutes: 20 },
  { id: 'p2', name: 'Noiric Loaded Pizza', category: 'Pizzas', description: 'Smoked pepperoni, herb chicken, olives & double mozzarella.', price: 399, image: '/loaded_pizza.png', veg: false, badge: 'House favourite', minutes: 20 },
  { id: 'b1', name: 'Smoked Avocado Burger', category: 'Burgers', description: 'Grilled cottage cheese, avocado, cheddar & our house sauce.', price: 249, image: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?auto=format&fit=crop&w=600&q=80', veg: true, minutes: 15 },
  { id: 'b2', name: 'Espresso BBQ Chicken Burger', category: 'Burgers', description: 'Crispy chicken, provolone & smoky espresso barbecue sauce.', price: 289, image: 'https://images.unsplash.com/photo-1550547660-d9450f859349?auto=format&fit=crop&w=600&q=80', veg: false, badge: 'Try something new', minutes: 15 },
  { id: 'f1', name: 'Parmesan Truffle Fries', category: 'Sides', description: 'Golden skin-on fries, rosemary & shaved parmesan.', price: 179, image: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=600&q=80', veg: true, minutes: 10 },
  { id: 'f2', name: 'Peri-Peri Fries', category: 'Sides', description: 'A little heat, a lot of crunch. Served with garlic aioli.', price: 149, image: 'https://images.unsplash.com/photo-1573080496219-bb080dd4f877?auto=format&fit=crop&w=600&q=80', veg: true, minutes: 10 },
  { id: 'dr1', name: 'White Velvet Frappe', category: 'Frappes', description: 'Espresso, vanilla gelato & white chocolate. Cloud-soft cream.', price: 219, image: '/premium_frappe.png', veg: true, badge: 'Signature sip', minutes: 8 },
  { id: 'dr2', name: 'Salted Caramel Frappe', category: 'Frappes', description: 'Slow-steeped coffee, sea-salt caramel & butterscotch crumbs.', price: 239, image: '/premium_frappe.png', veg: true, minutes: 8 },
];
export const money = (value: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value);
export const stages = ['received', 'preparing', 'ready', 'served'] as const;
export type Order = { id: string; number: number; seat: number; customer_name: string; notes: string; status: typeof stages[number] | 'cancelled'; total: number; created_at: string; items: { id: string; name: string; quantity: number; price: number }[] };
