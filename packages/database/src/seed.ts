import { PrismaClient, UserRole, UserStatus, MarkerTag } from "../generated/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const masterLogin = process.env.MASTER_LOGIN ?? "ryvzin";
  const masterPassword = process.env.MASTER_PASSWORD ?? "serv20589";
  const passwordHash = await bcrypt.hash(masterPassword, 12);

  const master = await prisma.user.upsert({
    where: { login: masterLogin },
    update: {},
    create: {
      name: "Ryvzin",
      login: masterLogin,
      passwordHash,
      role: UserRole.MASTER,
      status: UserStatus.APPROVED,
    },
  });

  await prisma.character.upsert({
    where: { name: "Ryvzin Evangelico" },
    update: { userId: master.id },
    create: {
      name: "Ryvzin Evangelico",
      world: "Grimoria III",
      isPrincipal: true,
      markerTag: MarkerTag.MAIN,
      userId: master.id,
    },
  });

  console.log(`Seed concluído. Usuário MASTER: ${masterLogin}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
