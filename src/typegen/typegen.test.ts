import * as path from 'path';
import { generateTypesForDocument } from './typegen';
import { parseDefinition } from '../common/definition';

const examplePetAPIYAML = path.join(__dirname, '..', '..', '__tests__', 'resources', 'example-pet-api.openapi.yml');

describe('generateTypesForDocument', () => {
  let clientImports: string;
  let schemaTypes: string;
  let clientOperationTypes: string;
  let aliases: string;

  beforeAll(async () => {
    const document = await parseDefinition({ definition: examplePetAPIYAML });
    const types = await generateTypesForDocument(document, {
      transformOperationName: (operationId: string) => operationId,
      disableOptionalPathParameters: true,
    });
    clientImports = types.clientImports;
    schemaTypes = types.schemaTypes;
    clientOperationTypes = types.clientOperationTypes;
    aliases = types.rootLevelAliases;
  });

  describe('schema types', () => {
    it('should generate namespaces from valid v3 specification', async () => {
      expect(schemaTypes).toMatch('namespace Components')
      expect(schemaTypes).toMatch('namespace Schemas')
      expect(schemaTypes).toMatch('namespace Paths')
    });
  });

  describe('client imports', () => {
    it('should generate client imports for openapi-client-axios', () => {
      expect(clientImports).toMatch("from 'openapi-client-axios'");
      expect(clientImports).toMatch('OperationResponse,');
    });
  });

  describe('client operation types', () => {
    test('exports methods named after the operationId', async () => {
      expect(clientOperationTypes).toMatch('export interface OperationMethods');
      expect(clientOperationTypes).toMatch('getPets');
      expect(clientOperationTypes).toMatch('createPet');
      expect(clientOperationTypes).toMatch('getPetById');
      expect(clientOperationTypes).toMatch('replacePetById');
      expect(clientOperationTypes).toMatch('updatePetById');
      expect(clientOperationTypes).toMatch('deletePetById');
      expect(clientOperationTypes).toMatch('getOwnerByPetId');
      expect(clientOperationTypes).toMatch('getPetOwner');
      expect(clientOperationTypes).toMatch('getPetsMeta');
      expect(clientOperationTypes).toMatch('getPetsRelative');
    });

    test('types parameters', () => {
      expect(clientOperationTypes).toMatch(`parameters: Parameters<Paths.GetPetById.PathParameters>`);
      expect(clientOperationTypes).toMatch(`parameters: Parameters<Paths.ReplacePetById.PathParameters>`);
      expect(clientOperationTypes).toMatch(`parameters: Parameters<Paths.UpdatePetById.PathParameters>`);
      expect(clientOperationTypes).toMatch(`parameters: Parameters<Paths.DeletePetById.PathParameters>`);
      expect(clientOperationTypes).toMatch(`parameters: Parameters<Paths.GetOwnerByPetId.PathParameters>`);
      expect(clientOperationTypes).toMatch(`parameters: Parameters<Paths.GetPetOwner.PathParameters>`);
    });

    test('types responses', () => {
      expect(clientOperationTypes).toMatch(`OperationResponse<Paths.GetPets.Responses.$200 | Paths.GetPets.Responses.Default>`);
      expect(clientOperationTypes).toMatch('OperationResponse<Paths.CreatePet.Responses.$201>');
      expect(clientOperationTypes).toMatch('OperationResponse<Paths.GetPetById.Responses.$200>');
      expect(clientOperationTypes).toMatch('OperationResponse<Paths.ReplacePetById.Responses.$200>');
      expect(clientOperationTypes).toMatch('OperationResponse<Paths.UpdatePetById.Responses.$200>');
      expect(clientOperationTypes).toMatch('OperationResponse<Paths.DeletePetById.Responses.$200>');
      expect(clientOperationTypes).toMatch('OperationResponse<Paths.GetPetOwner.Responses.$200>');
      expect(clientOperationTypes).toMatch('OperationResponse<Paths.GetPetsMeta.Responses.$200>');
      expect(clientOperationTypes).toMatch('OperationResponse<Paths.GetPetsRelative.Responses.$200>');
    });

    test('exports PathsDictionary', async () => {
      expect(clientOperationTypes).toMatch('export interface PathsDictionary');
      expect(clientOperationTypes).toMatch(`['/pets']`);
      expect(clientOperationTypes).toMatch(`['/pets/{id}']`);
      expect(clientOperationTypes).toMatch(`['/pets/{id}/owner']`);
      expect(clientOperationTypes).toMatch(`['/pets/{petId}/owner/{ownerId}']`);
      expect(clientOperationTypes).toMatch(`['/pets/meta']`);
      expect(clientOperationTypes).toMatch(`['/pets/relative']`);
    });

    test('exports a Client', async () => {
      expect(clientOperationTypes).toMatch('export type Client =');
    });
  });

  describe('root level aliases', () => {
    test('exports type aliases for components defined in spec', async () => {
      expect(aliases).toMatch('export type PetId = Components.Schemas.PetId;');
      expect(aliases).toMatch('export type PetPayload = Components.Schemas.PetPayload;');
      expect(aliases).toMatch('export type QueryLimit = Components.Schemas.QueryLimit;');
      expect(aliases).toMatch('export type QueryOffset = Components.Schemas.QueryOffset;');
    });
  });

});
