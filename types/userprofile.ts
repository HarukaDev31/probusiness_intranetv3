import type { AuthMenu } from "~/services/authService";

export interface UserProfile{
    id:number,
    fullName?:string,
    photoUrl:string,
    email:string,
    dni:string,
    fechaNacimiento:string,
    idCountry:number,
    idDepartment:number,
    idProvince:number,
    idDistrict:number,
    phone?:string,
    soldCBM:number,
    embarquedCBM:number,
    goals?:string,
}
export interface UserBusiness{
    id:number,
    name:string,
    ruc:string,
    comercialCapacity:string,
    rubric:string,
    socialAddress?:string,
}
/** 'success' => true,
                'user' => [
                    'id' => $user->id,
                    'fullName' => $user->full_name,
                    'photoUrl' => $user->photo_url,
                    'email' => $user->email,
                    'documentNumber' => null, // Campo no disponible en la estructura actual
                    'age' => null, // Campo no disponible en la estructura actual
                    'country' => null, // Campo no disponible en la estructura actual
                    'city' => null, // Campo no disponible en la estructura actual
                    'phone' => $user->whatsapp,
                    'business' => $business,
                    'importedAmount' => 0, // Campo no disponible en la estructura actual
                    'importedContainers' => 0, // Campo no disponible en la estructura actual
                    'goals' => $user->goals,
                ],
                'iCantidadAcessoUsuario' => 1,
                'iIdEmpresa' => null,
                'menus' => $menus */
export interface UserProfileResponse{
    success:boolean,
    user:UserProfile,
    iCantidadAcessoUsuario:number,
    iIdEmpresa:number|null,
    menus:AuthMenu[],
}