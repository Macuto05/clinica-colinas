
// This file is a specific SHIM/WRAPPER to fix "Module not found" errors.
// It redirects references from "@/lib/prisma" to the correct location.

import { prisma } from "@/infrastructure/database/prisma/client";

export { prisma };
export default prisma;
