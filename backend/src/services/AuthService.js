import bcrypt from 'bcrypt';
import { signToken, publicUser } from '../lib/auth.js';
import { UserRepository } from '../repositories/UserRepository.js';

export class AuthService {
  constructor(ctx) {
    this.ctx = ctx;
    this.userRepo = new UserRepository(ctx);
  }

  async login(email, password, role) {
    const user = await this.userRepo.findByEmailAndRole(email, role);

    if (!user) {
      throw { status: 401, message: 'Invalid credentials' };
    }

    const isMatch = await bcrypt.compare(password, user.password).catch(() => false);
    const isLegacyPlaintext = user.password === password;

    if (!isMatch && !isLegacyPlaintext) {
      throw { status: 401, message: 'Invalid credentials' };
    }

    // Silent upgrade: hash legacy plaintext passwords on successful login
    if (!isMatch && isLegacyPlaintext) {
      user.password = await bcrypt.hash(password, 10);
      await this.userRepo.save(user);
    }

    if (!user.isActive) {
      throw { status: 403, message: 'Account is inactive or pending approval' };
    }

    return {
      token: signToken(user),
      user: publicUser(user)
    };
  }

  async changePassword(email, oldPassword, newPassword) {
    const matchingUsers = await this.userRepo.findAllByEmail(email);

    if (!matchingUsers.length) {
      throw { status: 401, message: 'Current password is incorrect' };
    }

    const user = matchingUsers[0];
    const isMatch = await bcrypt.compare(oldPassword, user.password).catch(() => false);
    const isLegacyPlaintext = user.password === oldPassword;

    if (!isMatch && !isLegacyPlaintext) {
      throw { status: 401, message: 'Current password is incorrect' };
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    for (const u of matchingUsers) {
      u.password = hashedNewPassword;
      u.isPasswordChanged = true;
    }

    await this.userRepo.saveMany(matchingUsers);
    return { message: 'Password changed successfully' };
  }
}
