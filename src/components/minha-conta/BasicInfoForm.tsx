
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { User, CreditCard, Building, Calendar, Phone } from 'lucide-react';
import { formatCpf, formatCnpj, formatPhone, formatDateOfBirth } from '@/utils/formatters';

interface UserData {
  full_name: string;
  email: string;
  tipo_pessoa?: 'fisica' | 'juridica';
  cpf?: string;
  cnpj?: string;
  data_nascimento?: string;
  telefone?: string;
}

interface BasicInfoFormProps {
  userData: UserData;
  onInputChange: (field: string, value: string) => void;
}

const BasicInfoForm: React.FC<BasicInfoFormProps> = ({ userData, onInputChange }) => {
  const handleCpfChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCpf(e.target.value);
    onInputChange('cpf', formatted);
  };

  const handleCnpjChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCnpj(e.target.value);
    onInputChange('cnpj', formatted);
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatPhone(e.target.value);
    onInputChange('telefone', formatted);
  };

  const handleDateOfBirthChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value;
    
    // Se o valor contém mais de 8 dígitos e não tem barras, provavelmente é uma data colada
    if (value.length > 8 && !value.includes('/')) {
      // Detectar formato AAAA-MM-DD (ISO format)
      if (value.includes('-') && value.length === 10) {
        const [year, month, day] = value.split('-');
        value = `${day}/${month}/${year}`;
      } else if (value.length === 8) {
        // DDMMAAAA format
        value = value.replace(/(\d{2})(\d{2})(\d{4})/, '$1/$2/$3');
      }
    } else {
      // Formatação normal com autocompletar barras
      value = formatDateOfBirth(value);
    }
    
    onInputChange('data_nascimento', value);
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5 text-brand-purple" />
          Informações Básicas
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="full_name">Nome Completo *</Label>
            <Input
              id="full_name"
              value={userData.full_name || ''}
              onChange={(e) => onInputChange('full_name', e.target.value)}
              placeholder="Digite seu nome completo"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input
              id="email"
              type="email"
              value={userData.email || ''}
              readOnly
              className="bg-gray-100 cursor-not-allowed"
              placeholder="Digite seu e-mail"
            />
            <p className="text-xs text-gray-500">E-mail não pode ser alterado</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="tipo_pessoa">Tipo de Pessoa</Label>
            <Select
              value={userData.tipo_pessoa || 'fisica'}
              onValueChange={(value: 'fisica' | 'juridica') => onInputChange('tipo_pessoa', value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fisica">Pessoa Física</SelectItem>
                <SelectItem value="juridica">Pessoa Jurídica</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {userData.tipo_pessoa === 'fisica' ? (
            <div className="space-y-2">
              <Label htmlFor="cpf">CPF</Label>
              <div className="relative">
                <CreditCard className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="cpf"
                  value={userData.cpf || ''}
                  onChange={handleCpfChange}
                  placeholder="000.000.000-00"
                  className="pl-10"
                  maxLength={14}
                />
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="cnpj">CNPJ</Label>
              <div className="relative">
                <Building className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  id="cnpj"
                  value={userData.cnpj || ''}
                  onChange={handleCnpjChange}
                  placeholder="00.000.000/0000-00"
                  className="pl-10"
                  maxLength={18}
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="data_nascimento">Data de Nascimento</Label>
            <div className="relative">
              <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="data_nascimento"
                type="text"
                value={userData.data_nascimento || ''}
                onChange={handleDateOfBirthChange}
                placeholder="DD/MM/AAAA"
                className="pl-10"
                maxLength={10}
              />
            </div>
            <p className="text-xs text-gray-500">Digite ou cole a data (DD/MM/AAAA)</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="telefone">Telefone</Label>
            <div className="relative">
              <Phone className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                id="telefone"
                value={userData.telefone || ''}
                onChange={handlePhoneChange}
                placeholder="(00) 00000-0000"
                className="pl-10"
                maxLength={15}
              />
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default BasicInfoForm;
