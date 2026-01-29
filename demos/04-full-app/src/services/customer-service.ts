import { Injectable } from '@dira/di';
import type {
  Customer,
  CreateCustomerInput,
  UpdateCustomerInput,
} from '../domain/customer';

// Module-level storage to persist across requests
const customerStore = new Map<string, Customer>();
let nextId = 1;

@Injectable()
export class CustomerService {
  async list(): Promise<Customer[]> {
    return Array.from(customerStore.values());
  }

  async get(id: string): Promise<Customer | null> {
    return customerStore.get(id) ?? null;
  }

  async create(input: CreateCustomerInput): Promise<Customer> {
    const id = String(nextId++);
    const customer: Customer = {
      id,
      name: input.name,
      email: input.email,
      createdAt: new Date().toISOString(),
    };
    customerStore.set(id, customer);
    return customer;
  }

  async update(
    id: string,
    input: UpdateCustomerInput,
  ): Promise<Customer | null> {
    const customer = customerStore.get(id);
    if (!customer) return null;

    if (input.name !== undefined) customer.name = input.name;
    if (input.email !== undefined) customer.email = input.email;

    return customer;
  }

  async delete(id: string): Promise<boolean> {
    return customerStore.delete(id);
  }
}
