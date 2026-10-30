import { Body, Controller, Get, HttpCode, Post, Req, UseGuards } from "@nestjs/common";
import type { Request } from "express";
import { AuthService } from "../../application/auth/auth.service";
import { JwtAuthGuard } from "./jwt-auth.guard";
import { LoginDto, RegisterDto } from "../../application/auth/auth.dto";

@Controller("auth")
export class AuthController {
  constructor(private readonly auth: AuthService) {}

  @Post("register")
  register(@Body() dto: RegisterDto) {
    return this.auth.register(dto);
  }

  @Post("login")
  @HttpCode(200)
  login(@Body() dto: LoginDto) {
    return this.auth.login(dto);
  }

  @Get("me")
  @UseGuards(JwtAuthGuard)
  me(@Req() request: Request & { user?: { id: string } }) {
    return this.auth.me(request.user!.id);
  }
}
