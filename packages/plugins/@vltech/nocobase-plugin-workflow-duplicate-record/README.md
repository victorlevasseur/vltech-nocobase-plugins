# @vltech/nocobase-plugin-workflow-duplicate-record

A NocoBase workflow plugin that adds a **Duplicate Record** node to your workflow builder. This allows you to easily create copies of existing records with the ability to customize specific fields in the duplicated record.

## What Does This Plugin Do?

This plugin adds a new workflow node called "Duplicate Record" that you can use in your NocoBase workflows. When triggered, it will:

1. Find an existing record in any collection
2. Create a copy of that record with all its data
3. Optionally customize specific fields in the new copy
4. Return the newly created record for use in subsequent workflow steps

**Perfect for scenarios like:**
- Creating template-based records (duplicate a template and customize it)
- Copying orders, products, or documents with modified fields
- Archiving records by creating duplicates with different status
- Building approval workflows where you need modified copies

## Installation

### Step 1: Install the Plugin

Add the plugin to your NocoBase installation:

```bash
yarn add @vltech/nocobase-plugin-workflow-duplicate-record
```

### Step 2: Enable the Plugin

1. Log in to your NocoBase admin panel
2. Go to **Settings** → **Plugin Manager**
3. Find "Workflow: Duplicate Record" in the plugin list
4. Click **Enable** to activate the plugin

Once enabled, the "Duplicate Record" node will be available in all your workflow builders.

## How to Use in NocoBase UI

### Adding the Duplicate Record Node to a Workflow

1. Open or create a workflow in NocoBase (**Settings** → **Workflow**)
2. Click the **+** button to add a new node
3. Select **"Duplicate Record"** from the instruction list
4. Configure the node using the settings panel (see below)

### Configuring the Node

The Duplicate Record node has the following configuration options:

#### 1. Collection (Required)

Select the collection that contains the record you want to duplicate.

- **In the UI**: Use the dropdown to select from your available collections
- **Example**: Select "Products" to duplicate a product record

#### 2. Source Record ID (Optional*)

Specify which record to duplicate.

- **Option A - Use a specific ID**: Enter or select a record ID directly
- **Option B - Use workflow variable**: Click the "x" button next to the field to use variables from previous workflow nodes
- **Option C - Use previous node result**: Leave empty to automatically use the record from the previous workflow node

*If you leave this empty, the plugin will automatically use the `id` from the previous workflow node's result.

#### 3. Field Overrides (Optional)

Customize specific fields in the duplicated record.

- Click **"Add field override"** to add a new override
- **Field**: Select which field you want to customize
- **Value**: Enter the new value (can use workflow variables)

**Common examples:**
- Change the "Status" field to "Draft"
- Modify the "Name" field to add "Copy of..." prefix
- Update date fields to current date
- Change ownership or assignment fields

#### 4. Continue on Failure (Optional)

Toggle this option to control what happens if duplication fails.

- **Off (default)**: Workflow stops if duplication fails
- **On**: Workflow continues even if duplication fails (useful for non-critical duplications)

### Example Use Cases

#### Example 1: Duplicate a Product as a Draft

**Scenario**: You want to duplicate an existing product but set its status to "Draft" for editing.

**Configuration:**
1. **Collection**: Products
2. **Source Record ID**: Use workflow variable or enter product ID
3. **Field Overrides**:
   - Field: "status" → Value: "draft"
   - Field: "name" → Value: `{{$context.name}} (Copy)`

#### Example 2: Create Order Copy for Archive

**Scenario**: When an order is completed, create a copy for archival purposes.

**Configuration:**
1. **Collection**: Orders
2. **Source Record ID**: Leave empty (uses trigger record)
3. **Field Overrides**:
   - Field: "status" → Value: "archived"
   - Field: "archivedDate" → Value: `{{$system.now}}`

#### Example 3: Template-Based Record Creation

**Scenario**: Use a template record to create new records with specific customizations.

**Configuration:**
1. **Collection**: Projects
2. **Source Record ID**: 123 (your template project ID)
3. **Field Overrides**:
   - Field: "name" → Value: `{{$context.clientName}} Project`
   - Field: "startDate" → Value: `{{$system.now}}`
   - Field: "status" → Value: "planning"

## How It Works

1. **Field Copying**: The plugin copies all regular fields from the source record, excluding:
   - System fields: `id`, `createdAt`, `updatedAt`, `createdById`, `updatedById`, `createdBy`, `updatedBy`, `__v`, `sort`
   - Relation fields themselves (but their foreign keys are copied)

2. **Relation Handling**:
   - **BelongsTo relations**: Foreign keys are automatically copied as regular fields
   - **HasOne, HasMany, BelongsToMany**: Not duplicated (only applicable to the original record)

3. **Field Overrides**: Applied after copying, allowing you to customize specific fields in the new record

4. **Result**: Returns the newly created record as JSON, which can be used in subsequent workflow nodes

## Output

The instruction returns a job result with the following structure:

```typescript
{
  status: 'resolved' | 'failed',
  result: {
    // The duplicated record data (if successful)
    id: number,
    // ... all other fields from the duplicated record

    // Or error information (if failed)
    error: string,
    stack: string
  }
}
```

## Development

See the [root README](../../../../README.md) for development setup instructions.

## License

See the root package.json for license information.
