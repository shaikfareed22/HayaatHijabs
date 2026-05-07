import { supabase } from "@/integrations/supabase/client";

export interface CartItem {
  id: string;
  user_id: string;
  product_id: string;
  variant_id: string;
  quantity: number;
  created_at: string;
  updated_at: string;
  product_variants: {
    id: string;
    price: number;
    color: string;
    size: string | null;
    sku: string;
    stock_quantity: number;
    product_images: Array<{
      image_url: string;
      alt_text: string | null;
      is_primary: boolean | null;
    }>;
    products: {
      id: string;
      name: string;
      slug: string;
      short_description: string | null;
    };
  };
}

export interface CartResponse {
  items: CartItem[];
  itemCount: number;
  subtotal: string;
}

export interface AddToCartRequest {
  product_id: string;
  variant_id: string;
  quantity?: number;
}

export interface UpdateCartItemRequest {
  cart_item_id: string;
  quantity: number;
}

export interface RemoveFromCartRequest {
  cart_item_id: string;
}

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;

class CartService {
  private async getToken(): Promise<string> {
    const { data: session } = await supabase.auth.getSession();
    if (!session?.session?.access_token) {
      throw new Error('User must be authenticated to access cart');
    }
    return session.session.access_token;
  }

  private async makeRequest<T>(method: string, body?: any): Promise<T> {
    const token = await this.getToken();

    const response = await fetch(
      `${SUPABASE_URL}/functions/v1/cart`,
      {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: body ? JSON.stringify(body) : undefined,
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Network error' }));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  async getCart(): Promise<CartResponse> {
    return this.makeRequest<CartResponse>('GET');
  }

  async addToCart(request: AddToCartRequest): Promise<{ data: any; message: string }> {
    return this.makeRequest('POST', {
      product_id: request.product_id,
      variant_id: request.variant_id,
      quantity: request.quantity || 1,
    });
  }

  async updateCartItem(request: UpdateCartItemRequest): Promise<{ data: any; message: string }> {
    // If quantity is 0 or less, remove instead
    if (request.quantity <= 0) {
      return this.removeFromCart({ cart_item_id: request.cart_item_id });
    }
    return this.makeRequest('PUT', {
      cart_item_id: request.cart_item_id,
      quantity: request.quantity,
    });
  }

  async removeFromCart(request: RemoveFromCartRequest): Promise<{ data: any; message: string }> {
    return this.makeRequest('DELETE', {
      cart_item_id: request.cart_item_id,
    });
  }
}

export const cartService = new CartService();
