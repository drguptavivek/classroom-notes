import { getUser } from '../../auth';
export async function GET(){return Response.json({isOwner:!!await getUser()},{headers:{'Cache-Control':'no-store'}});}
