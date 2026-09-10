import { IAuthService } from './auth.service.interface';
import { IUserService } from './user.service.interface';
import { IMenuService } from './menu.service.interface';
import { AuthService } from './impl/auth.service';
import { UserService } from './impl/user.service';
import { MenuService } from './impl/menu.service';

class ServiceFactory {
  private authService: IAuthService | null = null;
  private userService: IUserService | null = null;
  private menuService: IMenuService | null = null;

  getAuthService(): IAuthService {
    if (!this.authService) {
      this.authService = new AuthService();
    }
    return this.authService;
  }

  getUserService(): IUserService {
    if (!this.userService) {
      this.userService = new UserService();
    }
    return this.userService;
  }

  getMenuService(): IMenuService {
    if (!this.menuService) {
      this.menuService = new MenuService();
    }
    return this.menuService;
  }
}

export const serviceFactory = new ServiceFactory();
