import { NextResponse, NextRequest } from 'next/server';
import { query } from '@/lib/db';
import { createWalletClient, http, publicActions } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { baseSepolia } from 'viem/chains';
import { FarQueueRegistryABI } from '@/lib/abi';

export async function POST(request: NextRequest) {
  try {
    
    const { fid } = await request.json();
    if (!fid) return NextResponse.json({ message: 'User FID is required.' }, { status: 400 });

    const [user] = await query('SELECT verified_address FROM users WHERE fid = ?', [fid]);
    if (!user || !user.verified_address) {
        return NextResponse.json({ message: 'User wallet address not found.' }, { status: 404 });
    }

    const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`;
    const account = privateKeyToAccount(process.env.BACKEND_WALLET_PRIVATE_KEY as `0x${string}`);
    const client = createWalletClient({ account, chain: baseSepolia, transport: http() }).extend(publicActions);

    const { request: mintRequest } = await client.simulateContract({
      address: contractAddress,
      abi: FarQueueRegistryABI,
      functionName: 'safeMint',
      args: [user.verified_address],
    });

    const txHash = await client.writeContract(mintRequest);

    // Create a timestamp for when the upgrade happened
    const proSinceDate = new Date();

    // UPDATE the SQL query to include the new columns
    await query(
      'UPDATE users SET is_pro = TRUE, is_registered_onchain = TRUE, upgrade_tx_hash = ?, pro_since = ? WHERE fid = ?', 
      [txHash, proSinceDate, fid]
    );

    return NextResponse.json({ message: 'Upgrade successful! You now have unlimited casts.', txHash }, { status: 200 });
  } catch (error) {
    console.error('Upgrade Error:', error);
    return NextResponse.json({ message: 'Failed to upgrade account.' }, { status: 500 });
  }
}