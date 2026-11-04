"use strict";

const path = require("path");
const { seedDatabase, datasetPath, defaultDatabasePath } = require("./dataset");

async function restore(filePath = defaultDatabasePath) {
  const result = await seedDatabase(filePath);
  return result;
}

if (require.main === module) {
  const requested = process.argv[2] ? path.resolve(process.argv[2]) : defaultDatabasePath;
  restore(requested)
    .then(({ target, report }) => {
      console.log(`Base didática redefinida em ${target}`);
      console.log(`Origem: ${datasetPath}`);
      console.log(`Produtos: ${report.produtos} (${report.catalogoAtivo} no catálogo ativo)`);
      console.log(`Clientes: ${report.clientes}`);
      console.log(`Cupons: ${report.cupons}`);
      console.log(`Pedidos: ${report.pedidos}`);
      console.log(`Itens: ${report.itens}`);
      console.log("Estoque preservado, sem desconto dos pedidos históricos.");
      console.log("Contas locais: cliente-a@loja.test, cliente-b@loja.test e admin@loja.test");
      console.log("Senha das três contas: SenhaDidatica123!");
      console.log("Pare o servidor antes do reset e inicie-o de novo em seguida.");
    })
    .catch((error) => {
      console.error(error.message || error);
      process.exit(1);
    });
}

module.exports = {
  restore,
};
