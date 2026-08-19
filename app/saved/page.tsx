"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Heart, ArrowRight } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { products, type Product } from "@/lib/data";
import { ProductCard } from "@/components/product-card";

type SavedItem = {
  product_id: string;
};

export default function SavedPage() {
  const [savedProducts, setSavedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [loggedIn, setLoggedIn] = useState(false);

  useEffect(() => {
    async function loadSavedProducts() {
      const supabase = createClient();

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setLoggedIn(false);
        setLoading(false);
        return;
      }

      setLoggedIn(true);

      const { data, error } = await supabase
        .from("saved_items")
        .select("product_id")
        .eq("user_id", user.id);

      if (error) {
        console.error("Failed to load saved products:", error);
        setLoading(false);
        return;
      }

      const savedItems = (data ?? []) as SavedItem[];

      const matchedProducts = savedItems
        .map((item) =>
          products.find((product) => product.id === item.product_id)
        )
        .filter((product): product is Product => Boolean(product));

      setSavedProducts(matchedProducts);
      setLoading(false);
    }

    loadSavedProducts();
  }, []);

  if (loading) {
    return (
      <div className="page-shell section-space">
        <p className="eyebrow mb-4">Saved</p>

        <h1 className="text-5xl font-semibold tracking-[-.06em]">
          Your finds.
        </h1>

        <p className="mt-6 text-sm text-[color:var(--muted)]">
          Loading your saved pieces...
        </p>
      </div>
    );
  }

  if (!loggedIn) {
    return (
      <div className="page-shell section-space">
        <div className="mx-auto max-w-xl text-center">
          <div className="mx-auto grid size-16 place-items-center border hairline">
            <Heart size={22} strokeWidth={1.5} />
          </div>

          <p className="eyebrow mt-8 mb-4">Saved</p>

          <h1 className="text-5xl font-semibold tracking-[-.06em]">
            Keep your finds.
          </h1>

          <p className="mx-auto mt-5 max-w-md text-sm leading-7 text-[color:var(--muted)]">
            Create an account or log in to save pieces and build your own
            collection of finds.
          </p>

          <div className="mt-8 flex justify-center gap-3">
            <Link
              href="/login"
              className="button button-dark"
              data-cursor="LOGIN"
            >
              Log in
              <ArrowRight size={15} />
            </Link>

            <Link
              href="/signup"
              className="button"
              data-cursor="JOIN"
            >
              Create account
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="page-shell section-space">
      <p className="eyebrow mb-4">Saved</p>

      <h1 className="text-5xl font-semibold tracking-[-.06em]">
        Your finds.
      </h1>

      <p className="mt-4 text-sm text-[color:var(--muted)]">
        Pieces you've saved on Syllis.
      </p>

      {savedProducts.length === 0 ? (
        <div className="mt-12 border hairline p-10 text-center">
          <Heart size={24} strokeWidth={1.5} className="mx-auto" />

          <h2 className="mt-5 text-xl font-semibold">
            Nothing saved yet.
          </h2>

          <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-[color:var(--muted)]">
            Explore Syllis and save pieces you want to come back to.
          </p>

          <Link
            href="/discover"
            className="button button-dark mt-7"
            data-cursor="DISCOVER"
          >
            Discover pieces
            <ArrowRight size={15} />
          </Link>
        </div>
      ) : (
        <div className="mt-10 grid grid-cols-2 gap-x-3 gap-y-10 md:grid-cols-4 md:gap-x-5">
          {savedProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}