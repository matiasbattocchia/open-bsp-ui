import { supabase as dbClient } from "@/supabase/client";

export class ApiService {
  private static instance: ApiService;
  public supabase;

  constructor() {
    this.supabase = dbClient;
  }

  public static getInstance(): ApiService {
    if (!ApiService.instance) {
      ApiService.instance = new ApiService();
    }
    return ApiService.instance;
  }
}
