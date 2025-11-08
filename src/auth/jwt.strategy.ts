import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor(private readonly configService: ConfigService) {
    const secret = configService.get<string>('JWT_SECRET');

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: secret || 'default_secret',
    });
  }

  async validate(payload: any) {
    // payload comes from the token (you signed it in AuthService.login)
    // e.g., { sub: user._id, email: user.email, role: user.role }
    return { userId: payload.sub, email: payload.email, role: payload.role };
  }
}
