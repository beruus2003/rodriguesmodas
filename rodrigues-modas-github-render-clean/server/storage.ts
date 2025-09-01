// server/storage.ts
// ... (todo o início do arquivo continua igual até a função getCartItems)

  /**
   * Busca todos os itens do carrinho de um usuário, já com os dados dos produtos.
   */
  // ================== MUDANÇA PARA DEBUG ==================
  // Temporariamente removendo a busca com relações para isolar o bug
  async getCartItems(userId: string): Promise<CartItem[]> { // Retorna apenas CartItem, sem o produto
    const userCart = await db.query.carts.findFirst({
        where: eq(cartsTable.userId, userId)
    });

    if (!userCart) {
        return [];
    }

    const items = await db.query.cartItems.findMany({
        where: eq(cartItemsTable.cartId, userCart.id),
        // A linha "with: { product: true }" foi removida daqui
        orderBy: (cartItems, { asc }) => [asc(cartItems.createdAt)],
    });

    return items;
  }
  
// ... (o resto do arquivo, como addToCart e os métodos não implementados, continua igual)
