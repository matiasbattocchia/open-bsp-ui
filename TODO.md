TODO

UI

- [ ] Aceptar invitación
- [ ] Redirect login google no respeta hash identifier. Parece que supabase lo tira o lo reemplaza por un access token
- [ ] Templates
- [x] Agents
- [x] Initial data fetch -> by org
- [ ] Cómo mostrar mensajes de agentes eliminados?
- [ ] Nombres de conversaciones de prueba?
- [ ] Preview mensajes internos
- [ ] Bug mensajes internos (tipo error) se muestran como incoming en conversaciones de prueba
- [ ] Mostrar nuevas conversaciones vacías en la lista de chats?

API

- [ ] Roles: owner, admin, user
- [ ] Define agent extra types
- [ ] Setup a hard limit of 10 orgs per user
- [ ] Create owner after creating org
- [ ] Cannot delete last owner
- [ ] Invitations functions
  - [ ] Do not bring org data if agent status "pending"
  - [ ] If user exists, associate user_id
  - [ ] Upon user creation, associate user_id
  - [ ] Member invitation email should be unique per org