import { join } from 'path';
import { Cache } from 'cache-manager';
import { Inject, Injectable } from '@nestjs/common';
import { ConfigType } from '@nestjs/config';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Admin, AdminMeta, AdminStatus } from '@prisma/client';
import { adminConfigFactory } from '@Config';
import {
  StorageService,
  UtilsService,
  ValidatedUser,
  UserType,
  getAccessGuardCacheKey,
} from '@Common';
import { PrismaService } from '../prisma';

@Injectable()
export class AdminService {
  constructor(
    @Inject(adminConfigFactory.KEY)
    private readonly config: ConfigType<typeof adminConfigFactory>,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
    private readonly prisma: PrismaService,
    private readonly utilsService: UtilsService,
    private readonly storageService: StorageService,
  ) {}

  private getProfileImageUrl(profileImage: string): string {
    return this.storageService.getFileUrl(
      profileImage,
      this.config.profileImagePath,
    );
  }

  private hashPassword(password: string): { salt: string; hash: string } {
    const salt = this.utilsService.generateSalt(this.config.passwordSaltLength);
    const hash = this.utilsService.hashPassword(
      password,
      salt,
      this.config.passwordHashLength,
    );
    return { salt, hash };
  }
  async isUsernameExist(
    username: string,
    excludeUserId?: string,
  ): Promise<boolean> {
    return (
      (await this.prisma.user.count({
        where: {
          username,
          NOT: {
            id: excludeUserId,
          },
        },
      })) !== 0
    );
  }

  async isEmailExist(email: string, excludeAdminId?: string): Promise<boolean> {
    return (
      (await this.prisma.admin.count({
        where: {
          email: email.toLowerCase(),
          NOT: {
            id: excludeAdminId,
          },
        },
      })) !== 0
    );
  }

  async getById(adminId: string): Promise<Admin> {
    return await this.prisma.admin.findUniqueOrThrow({
      where: {
        id: adminId,
      },
    });
  }

  async getByEmail(email: string): Promise<Admin | null> {
    return await this.prisma.admin.findUnique({
      where: {
        email: email.toLowerCase(),
      },
    });
  }

  async getMetaById(adminId: string): Promise<AdminMeta> {
    return await this.prisma.adminMeta.findUniqueOrThrow({
      where: {
        adminId,
      },
    });
  }

  async authenticate(adminId: string, password: string): Promise<Admin> {
    const admin = await this.getById(adminId);
    const validation = await this.validateCredentials(admin.email, password);

    if (!validation === null) throw new Error('Admin not found');
    if (validation === false) throw new Error('Incorrect password');

    return admin;
  }

  async validateCredentials(
    email: string,
    password: string,
  ): Promise<ValidatedUser | false | null> {
    const admin = await this.getByEmail(email);
    if (!admin) return null;
    if (admin.status !== AdminStatus.Active) {
      throw new Error(
        'Your account has been temporarily suspended/blocked by the system',
      );
    }

    const adminMeta = await this.getMetaById(admin.id);
    const passwordHash = this.utilsService.hashPassword(
      password,
      adminMeta.passwordSalt || '',
      adminMeta.passwordHash
        ? adminMeta.passwordHash.length / 2
        : this.config.passwordHashLength,
    );

    if (adminMeta.passwordHash === passwordHash) {
      return {
        id: admin.id,
        type: UserType.Admin,
      };
    }

    return false;
  }

  async getProfile(adminId: string): Promise<Admin> {
    const admin = await this.getById(adminId);
    if (admin.profileImage) {
      admin.profileImage = this.getProfileImageUrl(admin.profileImage);
    }
    return admin;
  }

  async updateProfileDetails(
    adminId: string,
    firstname?: string,
    lastname?: string,
    email?: string,
  ): Promise<Admin> {
    if (email && (await this.isEmailExist(email, adminId)))
      throw new Error('Email already exist');

    return await this.prisma.admin.update({
      data: {
        firstname,
        lastname,
        email: email && email.toLowerCase(),
      },
      where: {
        id: adminId,
      },
    });
  }

  async updateProfileImage(
    adminId: string,
    profileImage: string,
  ): Promise<{ profileImage: string | null }> {
    const admin = await this.getById(adminId);

    return await this.prisma.$transaction(async (tx) => {
      await tx.admin.update({
        where: { id: adminId },
        data: { profileImage },
      });

      // Remove previous profile image from storage
      if (admin.profileImage) {
        await this.storageService.removeFile(
          join(this.config.profileImagePath, admin.profileImage),
        );
      }
      await this.storageService.move(
        profileImage,
        this.config.profileImagePath,
      );

      return {
        profileImage: this.getProfileImageUrl(profileImage),
      };
    });
  }

  async changePassword(
    adminId: string,
    oldPassword: string,
    newPassword: string,
  ): Promise<Admin> {
    const admin = await this.getById(adminId);
    const adminMeta = await this.getMetaById(admin.id);

    const hashedPassword = this.utilsService.hashPassword(
      oldPassword,
      adminMeta.passwordSalt || '',
      adminMeta.passwordHash
        ? adminMeta.passwordHash.length / 2
        : this.config.passwordHashLength,
    );

    if (hashedPassword !== adminMeta.passwordHash)
      throw new Error('Password does not match');

    const { salt, hash } = this.hashPassword(newPassword);
    const passwordSalt = salt;
    const passwordHash = hash;

    await this.prisma.adminMeta.update({
      data: {
        passwordHash,
        passwordSalt,
      },
      where: {
        adminId,
      },
    });
    return admin;
  }

  async setStatus(userId: string, status: AdminStatus): Promise<Admin> {
    await this.cacheManager.del(
      getAccessGuardCacheKey({ id: userId, type: UserType.Admin }),
    );
    return await this.prisma.admin.update({
      data: { status },
      where: {
        id: userId,
      },
    });
  }
  async createSubUser(
    firstname: string,
    lastname: string,
    username: string,
    password: string,
    usertype: string,
  ) {
    if (await this.isUsernameExist(username)) {
      throw new Error('Username already exist');
    }
    const validUserTypes = ['MANAGER', 'WORKER'];
    console.log('usertype', username, usertype);

    if (!validUserTypes.includes(usertype)) {
      throw new Error('UserType is not valid');
    }

    let passwordSalt = null;
    let passwordHash = null;
    if (password) {
      const { salt, hash } = this.hashPassword(password);
      passwordSalt = salt;
      passwordHash = hash;
    }

    return await this.prisma.user.create({
      data: {
        firstname: firstname,
        lastname: lastname,
        username: username,
        usertype: usertype,

        meta: {
          create: {
            passwordHash,
            passwordSalt,
          },
        },
      },
    });
  }
}
