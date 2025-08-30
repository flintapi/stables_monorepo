import db from "@/db";


export async function transactionHashAndRefDedup(hash: `0x${string}`, ref: string) {
  const trx = await db.query.transactions.findFirst({
    where(fields, ops) {
      return ops.or(
        ops.eq(fields.transactionHash, hash),
        ops.eq(fields.reference, ref)
      )
    }
  })

  console.log(trx, ":::Transaction exists check")

  if(trx) return false
  return true
}
