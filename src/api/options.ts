import { listCategories } from "./categories";
import { listCustomers } from "./customers";
import { listProducts } from "./products";
import type { SelectOption } from "../components/Select";

const OPTION_LIMIT = 20;

export const searchCategoryOptions = async (
  search: string
): Promise<SelectOption<string>[]> => {
  const result = await listCategories({
    search: search || undefined,
    status: "active",
    limit: OPTION_LIMIT,
  });

  return result.data.map((category) => ({
    value: category.id,
    label: category.name,
  }));
};

export const searchCustomerOptions = async (
  search: string
): Promise<SelectOption<string>[]> => {
  const result = await listCustomers({
    search: search || undefined,
    status: "active",
    limit: OPTION_LIMIT,
  });

  return result.data.map((customer) => ({
    value: customer.id,
    label: `${customer.name} · ${customer.phone}`,
  }));
};

export const searchProductOptions = async (
  search: string
): Promise<SelectOption<string>[]> => {
  const result = await listProducts({
    search: search || undefined,
    status: "active",
    limit: OPTION_LIMIT,
  });

  return result.data.map((product) => ({
    value: product.id,
    label: product.brand ? `${product.name} · ${product.brand}` : product.name,
  }));
};
